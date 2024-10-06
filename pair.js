<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PAIR CODE</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #141414;
      background-repeat: no-repeat;
      background-position: center;
      background-size: cover;
      font-family: 'Arial', sans-serif;
      color: #fff;
    }

    .container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .box {
      width: 350px;
      padding: 30px;
      position: relative;
      text-align: center;
      background: linear-gradient(135deg, #4859ec, #1e90ff);
      border-radius: 15px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
      position: relative;
      border: 2px solid #2980b9;
      transition: all 0.3s ease-in-out;
    }

    .box:hover {
      box-shadow: 0 0 30px rgba(0, 0, 0, 1);
      transform: translateY(-5px);
    }

    #text {
      color: #ffffff;
    }

    .input-container {
      display: flex;
      background: #f5f5f5;
      border-radius: 1rem;
      padding: 0.3rem;
      gap: 0.3rem;
      max-width: 300px;
      width: 100%;
      margin-top: 15px;
    }

    .input-container input {
      border-radius: 0.8rem 0 0 0.8rem;
      background: #222;
      width: 80%;
      padding: 1rem;
      border: none;
      border-left: 2px solid #4caf50;
      color: #ecf0f1;
      transition: all 0.2s ease-in-out;
    }

    .input-container input:focus {
      border-left: 2px solid #00e676;
      outline: none;
      box-shadow: inset 10px 10px 20px #333, inset -10px -10px 20px #555;
    }

    .input-container button {
      flex-basis: 25%;
      padding: 1rem;
      background: #25d366;
      font-weight: 900;
      letter-spacing: 0.3rem;
      text-transform: uppercase;
      color: white;
      border: none;
      width: 100%;
      border-radius: 0 1rem 1rem 0;
      transition: all 0.2s ease-in-out;
    }

    .input-container button:hover {
      background: #34af23;
      cursor: pointer;
    }

    #waiting-message {
      color: #ffffff;
      margin-top: 10px;
    }

    @media (max-width: 500px) {
      .input-container {
        flex-direction: column;
      }

      .input-container input, .input-container button {
        border-radius: 0.8rem;
        width: 100%;
      }
    }

    .centered-text {
      text-align: center;
    }

    /* Loading spinner styles */
    #loading-spinner {
      display: none;
      color: white;
      margin-top: 10px;
    }

    .fa-spinner {
      font-size: 2rem;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Code Copy Button */
    #copy {
      color: #f1c40f;
      cursor: pointer;
      transition: all 0.3s ease-in-out;
    }

    #copy:hover {
      color: #e67e22;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="main">
      <div class="box" id="box">
        <div id="text">
          <i class="fa fa-user"></i>
          <p>
            <h3 class="centered-text">Link with phone number</h3>
            <br>
            <h6>🔢 Enter your number with country code.</h6>
            <div class="input-container">
              <input placeholder="+94729xxxxxx" type="number" id="number" placeholder="❗ Enter your phone number with country code" name="">
              <button id="submit">Submit</button>
            </div>
            <div id="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
            </div>
            <br><br>
            <main id="pair"></main>
          </p>
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.0.0-alpha.1/axios.min.js"></script>
  <script>
    let a = document.getElementById("pair");
    let b = document.getElementById("submit");
    let c = document.getElementById("number");

    async function Copy() {
      let text = document.getElementById("copy").innerText;
      let obj = document.getElementById("copy");
      await navigator.clipboard.writeText(obj.innerText.replace('CODE: ', ''));
      obj.innerText = "✔️ COPIED";
      obj.style.color = "lightgreen";
      setTimeout(() => {
        obj.innerText = text;
        obj.style.color = "#f1c40f";
      }, 1000);
    }

    b.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!c.value) {
        a.innerHTML = '<a style="color:red;font-weight:bold">❗Enter your WhatsApp number with country code.</a><br><br>';
      } else if (c.value.replace(/[^0-9]/g, "").length < 11) {
        a.innerHTML = '<a style="color:red;font-weight:bold">❗Invalid number format. Please try again.</a><br><br>';
      } else {
        const bc = c.value.replace(/[^0-9]/g, "");
        c.type = "text";
        c.value = "+" + bc.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3");
        c.style.color = "#ecf0f1";

        document.getElementById("loading-spinner").style.display = "block";
        a.innerHTML = ''; 

        let { data } = await axios(`/code?number=${bc}`);
        let code = data.code || "❗ Service Unavailable";
        a.innerHTML = '<font id="copy" onclick="Copy()" style="color:red;font-weight:bold" size="5">CODE: <span style="color:white;font-weight:bold">' + code + '</span></font><br><br><br>';

        document.getElementById("loading-spinner").style.display = "none";
      }
    });
  </script>
</body>
</html>
