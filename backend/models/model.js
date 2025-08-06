import Datastore from "nedb-promises";
import mongoose from "mongoose";
import { ObjectId } from "bson";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const Dbs = {};
const Models = {};
const Hooks = {};

function runHooks(phase, modelName, action, doc) {
  const key = `${phase}:${modelName}:${action}`;
  const list = Hooks[key] || [];
  for (const fn of list) fn.call(doc);
}

function parseSelect(fields) {
  if (!fields) return null;
  const keys = typeof fields === "string" ? fields.split(/\s+/) : fields;
  const obj = {};
  keys.forEach((k) => (obj[k] = 1));
  return obj;
}

function normalizeIds(obj, schema) {
  if (Array.isArray(obj)) {
    return obj.map(item => normalizeIds(item, schema));
  }

  if (obj && typeof obj === "object") {
    const result = {};
    for (const key in obj) {
      const val = obj[key];
      const pathSchema = schema?.paths?.[key];
      const fieldType = pathSchema?.instance || pathSchema?.options?.type?.name;

      const isObjectId =
        key === "_id" ||
        fieldType === "ObjectId" ||
        pathSchema?.options?.ref ||
        (
          Array.isArray(pathSchema?.options?.type) &&
          pathSchema.options.type[0]?.type?.name === "ObjectId"
        );

      const convertToString = (v) => {
        if (!v) return v;
        if (typeof v.toHexString === "function") return v.toHexString();
        if (typeof v.toString === "function" && /^[a-f\d]{24}$/.test(v.toString())) return v.toString();
        if (v.buffer && typeof v.buffer === "object") {
          try {
            return Buffer.from(Object.values(v.buffer)).toString("hex");
          } catch {
            return v;
          }
        }
        return v;
      };

      if (Array.isArray(val)) {
        result[key] = isObjectId
          ? val.map(convertToString)
          : val.map(v => normalizeIds(v, schema));
      } else if (typeof val === "object" && val !== null) {
        result[key] = isObjectId
          ? convertToString(val)
          : normalizeIds(val, schema);
      } else {
        result[key] = isObjectId ? convertToString(val) : val;
      }
    }

    return result;
  }

  return obj;
}

function wrapDoc(doc, model) {
  doc.__model = model.modelName;
  doc.save = async function () {
    runHooks("pre", model.modelName, "save", this);
    const clean = normalizeIds(this, model.schema);
    const validated = await validateWithMongoose(model.schema, clean);
    await model.db.update({ _id: clean._id }, clean, { upsert: true });
    runHooks("post", model.modelName, "save", validated);
    return wrapDoc(validated, model);
  };

  doc.remove = async function () {
    runHooks("pre", model.modelName, "remove", this);
    await model.db.remove({ _id: this._id });
    runHooks("post", model.modelName, "remove", this);
    return this;
  };
  
  doc.populate = model.findById(doc._id).populate

  doc.toObject = () => ({ ...doc });
  doc.validate = () => validateWithMongoose(model.schema, doc);
  return doc;
}

async function validateWithMongoose(schema, data) {
  const tempSchema = new mongoose.Schema(schema.obj || {}, { _id: true, timestamps: false });
  const name = `Temp${Date.now()}_${Math.random()}`;
  const Temp = mongoose.models[name] || mongoose.model(name, tempSchema);

  const tempDoc = new Temp(data);
  await tempDoc.validate();
  return tempDoc.toObject();
}

function applyQueryChain(promise, model, chain = {}) {
  const handler = async () => {
    let docs = await promise;
    if (!Array.isArray(docs)) docs = docs ? [docs] : [];

    // select
    if (chain.select) {
      const fields = parseSelect(chain.select);
      docs = docs.map((d) => {
        const selected = {};
        for (const k in fields) if (d[k] !== undefined) selected[k] = d[k];
        return selected;
      });
    }

    // sort
    if (chain.sort) {
      const [key, order] = Object.entries(chain.sort)[0];
      docs.sort((a, b) => order * ((a[key] > b[key]) - (a[key] < b[key])));
    }

    // limit
    if (chain.limit) docs = docs.slice(0, chain.limit);

    // wrap and populate
    docs = await Promise.all(docs.map((d) => wrapDoc(d, model)));
    if (chain.populate) {
      docs = await Promise.all(docs.map((d) => populateDoc(d, chain.populate, model)));
    }

    return docs;
  };

  const chainObj = {
    populate(pop, select, nested) {
      chain.populate = typeof pop === "string" ? { path: pop, select, populate: nested } : pop;
      return chainObj;
    },
    select(fields) {
      chain.select = fields;
      return chainObj;
    },
    sort(obj) {
      chain.sort = obj;
      return chainObj;
    },
    limit(n) {
      chain.limit = n;
      return chainObj;
    },
    async countDocuments() {
      const res = await handler();
      return res.length;
    },
    async exec() {
      const res = await handler();
      return promise.single ? res[0] : res;
    },
    then(resolve, reject) {
      return handler().then(result => {
        return promise.single ? resolve?.(result[0]) : resolve?.(result);
      }, reject);
    }
  };

  return chainObj;
}

async function populateDoc(doc, pop, model) {
  const path = pop.path;
  const refInfo = model.schema.path(path);
  const refModelName = refInfo?.options?.ref;

  if (!refModelName) return doc;

  const Target = Models[refModelName];
  if (!Target) return doc;

  let ids = doc[path];
  if (!ids) return doc;

  if (!Array.isArray(ids)) ids = [ids];

  const populated = await Promise.all(ids.map(async id => {
    const d = await Target.findById(id.toString());
    if (!d) return null;
    const wrapped = await wrapDoc(d, Target);
    if (pop.select) {
      const selected = {};
      const keys = pop.select.split(/\s+/);
      for (const k of keys) selected[k] = wrapped[k];
      return selected;
    }
    if (pop.populate) {
      return await populateDoc(wrapped, pop.populate, Target);
    }
    return wrapped;
  }));

  doc[path] = Array.isArray(doc[path]) ? populated.filter(Boolean) : populated[0];
  return doc;
}

export default async function model(name, schema, options = {}) {
  if (Models[name]) return Models[name];

  const db = Datastore.create({
    filename: path.join("./backend/models/db", `${name}.db`),
    autoload: true
  });

  const Model = {
    modelName: name,
    db,
    schema,

    create: async (data) => {
  //if (!data._id) data._id = new ObjectId().toString();
  const validated = await validateWithMongoose(schema, data);
  const clean = normalizeIds(validated, schema);
  await db.insert(clean);
  return wrapDoc(clean, Model);
},

    find: (query = {}) => applyQueryChain(db.find(query), Model),
    
    findOne: (query = {}) => {
      const p = db.findOne(query).then((d) => (d ? [d] : []));
      p.single = true;
      return applyQueryChain(p, Model);
    },

    findById: (id) => {
      const p = db.findOne({ _id: id?.toString() }).then((d) => (d ? [d] : []));
      p.single = true;
      return applyQueryChain(p, Model);
    },

    findByIdAndUpdate: async (id, update = {}) => {
      const clean = normalizeIds(update, schema);
      await db.update({ _id: id.toString() }, clean);
      const updated = await db.findOne({ _id: id.toString() });
      return updated ? wrapDoc(updated, Model) : null;
    },

    findByIdAndDelete: async (id) => {
      const found = await db.findOne({ _id: id.toString() });
      if (!found) return null;
      await db.remove({ _id: id.toString() });
      return wrapDoc(found, Model);
    },

    updateOne: (filter, update) =>
      db.update(filter, normalizeIds(update, schema)),

    updateMany: (filter, update) =>
      db.update(filter, normalizeIds(update, schema), { multi: true }),

    deleteOne: (filter) => db.remove(filter),
    deleteMany: (filter) => db.remove(filter, { multi: true }),
    findOneAndUpdate: async function(filter, update){
       await this.updateOne(filter, update);
       return await this.findOne(filter)
    },
    countDocuments: (filter) => db.count(filter),
    wrapDoc
  };

  // Hooks
  schema.pre = (action, fn) => {
    const key = `pre:${name}:${action}`;
    Hooks[key] = Hooks[key] || [];
    Hooks[key].push(fn);
  };
  schema.post = (action, fn) => {
    const key = `post:${name}:${action}`;
    Hooks[key] = Hooks[key] || [];
    Hooks[key].push(fn);
  };

  Dbs[name] = db;
  Models[name] = Model;
  return Model;
}