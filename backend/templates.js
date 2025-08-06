const mailTemplate = (url, title = "email confirmation", buttonText = "confirm", description="this is description") => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Email Confirmation</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #107bc2;
      }
      table {
        border-spacing: 0;
      }
      img {
        border: 0;
        display: block;
      }
    </style>
  </head>
  <body>
    <center style="width: 100%; table-layout: fixed; background-color: #107bc2; padding: 20px 0;">
      <table width="90%" style="max-width: 600px; margin: 0 auto; background-color: #154564; border-radius: 8px; padding: 0;" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td align="center" style="padding: 20px 20px 10px 20px; font-family: Arial, sans-serif; color: lightgreen; font-size: 24px; font-weight: bold;">
            ${title}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 10px 20px; font-family: Arial, sans-serif; color: #ffffff; font-size: 16px;">
           ${description}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 20px;">
            <a href="${url}"
               style="display: inline-block; background-color: #107bc2; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-family: Arial, sans-serif; font-size: 16px;">
              ${buttonText}
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 10px 0;">
            <hr style="width: 80%; border: 1px solid #1e7ab6;">
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 10px; font-family: Arial, sans-serif; color: lightgray; font-size: 14px;">
            &copy; Snet Copyright
          </td>
        </tr>
      </table>
    </center>
  </body>
</html>`;

const messageTemplate = (message, redirect, img) => `
  <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>System Message</title>
  <link rel="stylesheet" href="/style.css" type="text/css" media="all" />
  <style>
    
    body{
      justify-content: center;
      align-items: center;
      row-gap: 2rem;
    }
    
    img{
      width: 200px;
      height: 200px;
      border-radius: 50%;
    }
    
  </style>
</head>
<body>
  
  <img src="${img}" alt="">
  <h3>${message}</h3>
  <b>wait while you will be redirected</b>
  
  <div class="copy">
    Snet 2025 &copy; Copyright
  </div>
  <script src="/main.js"></script>
  <script>
    
    const redirectDelay = 3 // in seconds 
    setTimeout(() => {
      navigate("${redirect}")
    }, redirectDelay * 1000)
    
  </script>
</body>
</html>`

export { mailTemplate, messageTemplate };
