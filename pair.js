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
      height: 400px;
      padding: 20px;
      position: relative;
      text-align: center;
      background-color: rgba(72, 133, 237, 0.8);
      border-radius: 15px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
      position: relative;
    }

    .centered-text {
      color: #ffffff;
      font-size: 24px;
    }

    .input-container {
      display: flex;
      background: #ffffff;
      border-radius: 1rem;
      padding: 0.3rem;
      gap: 0.3rem;
      max-width: 300px;
      width: 100%;
      margin-top: 15px;
    }

    .input-container input {
      border-radius: 0.8rem 0 0 0.8rem;
      background: #000000;
      width: 89%;
      flex-basis: 75%;
      padding: 1rem;
      border: none;
      border-left: 2px solid #075e54;
      color: #ecf0f1;
      transition: all 0.2s ease-in-out;
    }

    .input-container input:focus {
      border-left: 2px solid #34d399;
      outline: none;
      box-shadow: inset 13px 13px 10px #075e54, inset -13px -13px 10px #2c3e50;
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
      background: #2980b9;
    }

    #waiting-message {
      color: #ffffff;
      margin-top: 10px;
    }

    @media (max-width: 500px) {
      .input-container {
        flex-direction: column;
      }

      .input-container input,
      .input-container button {
        border-radius: 0.8rem;
      }
    }

    #loading-spinner {
      display: none;
      color: white;
      margin-top: 10px;
    }

    .fa-spinner {
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="main">
      <div class="box" id="box">
        <div id="text">
          <i class="fa fa-user fa-3x"></i>
          <h3 class="centered-text">🔗 Link with Phone Number</h3>
          <p>🔢 Enter your number with country code</p>
          <div class="input-container">
            <input placeholder="+94729xxxxxx" type="number" id="number" name="">
            <button id="submit">Submit</button>
          </div>
          <!-- Add the loading spinner -->
          <div id="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Processing...</p>
          </div>
          <br>
          <div id="pair" style="margin-top: 20px;"></div>
        </div>
      </div>
    </div>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.0.0-alpha.1/axios.min.js"></script>
  <script>
    let a = document.getElementById("pair");
    let b = document.getElementById("submit");
    let c = document.getElementById("number");
    let box = document.getElementById("box");

    async function Copy() {
      let text = document.getElementById("copy").innerText;
      let obj = document.getElementById("copy");
      await navigator.clipboard.writeText(obj.innerText.replace('CODE: ', ''));
      obj.innerText = "✔️ COPIED";
      obj.style = "color:red;font-weight:bold";
      setTimeout(() => {
        obj.innerText = text;
        obj.style = "color:white;font-weight-bold";
      }, 500);
    }

    b.addEventListener("click", async (e) => {
      e.preventDefault();
      if (!c.value) {
        a.innerHTML = '<span style="color:red;font-weight:bold">❗ Please enter your WhatsApp number with country code.</span><br><br>';
      } else if (c.value.replace(/[^0-9]/g, "").length < 11) {
        a.innerHTML = '<span style="color:red;font-weight:bold">❗ Invalid number format. Please try again.</span><br><br>';
      } else {
        const bc = c.value.replace(/[^0-9]/g, "");
        let bb = "";
        let bbc = "";
        const cc = bc.split('');
        cc.map(a => {
          bbc += a;
          if (bbc.length == 3) {
            bb += " " + a;
          } else if (bbc.length == 8) {
            bb += " " + a;
          } else {
            bb += a;
          }
        });
        c.type = "text";
        c.value = "+" + bb;
        c.style = "color:white;font-size:20px";
        
        // Show the loading spinner
        document.getElementById("loading-spinner").style.display = "block";
        a.innerHTML = ''; // Clear the previous content

        try {
          let { data } = await axios.get(`/code?number=${bc}`);
          let code = data.code || "❗ Service Unavailable";
          a.innerHTML = `<font id="copy" onclick="Copy()" style="color:red;font-weight:bold" size="5">CODE: <span style="color:white;font-weight:bold">${code}</span></font><br><br><br>`;
        } catch (error) {
          a.innerHTML = '<span style="color:red;font-weight:bold">❗ Error fetching the code. Please try again later.</span><br><br>';
        } finally {
          // Hide the loading spinner
          document.getElementById("loading-spinner").style.display = "none";
        }
      }
    });
  </script>
</body>
</html>
