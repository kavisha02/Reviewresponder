const { Resend } = require("resend");
const fs = require('fs');

const envLocal = fs.readFileSync('.env.local', 'utf8');
const match = envLocal.match(/RESEND_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : null;

if (!apiKey) {
  console.error("API key not found in .env.local");
  process.exit(1);
}

const resend = new Resend(apiKey);
console.log("API key loaded. Sending test email...");

async function run() {
  const result = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "test@example.com", // This will fail if not the verified email, but we can see the error
    subject: "Test email",
    html: "<p>Test</p>",
  });
  console.log(result);
}
run();
