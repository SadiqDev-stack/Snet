import colors from "colors";

const logger = (req, res, next) => {
  const { method, url } = req;
  const host = req.get('host');
  req.domain = host;
  console.log(colors.cyan(`\n\na host ${host}, Sent ${method} Request To ${url}\n\n`));
  next();
}

const log = (message, color = "good") => {
  switch (color) {
    case "good":
      console.log(`\n ${colors.green(message)} \n`);
      break;
    case "bad":
      console.log(`\n ${colors.red(message)} \n`);
      break;
    case "warning":
      console.log(`\n ${colors.yellow(message)} \n`);
      break;
    default:
      console.log(`\n ${message} \n`);
  }
}


export {
  log,
  logger
}