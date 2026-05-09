import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const resend = new Resend(process.env.RESEND_API_KEY);
console.log(process.env.RESEND_API_KEY ? "API key loaded" : "API key missing");
async function run() {
  const result = await resend.emails.send({
    from: "ReviewResponder <digest@reviewresponder.com>",
    to: "test@example.com",
    subject: "Test email",
    html: "<p>Test</p>",
  });
  console.log(result);
}
run();
