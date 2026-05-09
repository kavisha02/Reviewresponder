const { Resend } = require("resend");
const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

const resend = new Resend(process.env.RESEND_API_KEY);
console.log(process.env.RESEND_API_KEY ? "API key loaded" : "API key missing");
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
