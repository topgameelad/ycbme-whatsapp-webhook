import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { sendMessage } from "jsr:@supergreen/client";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Webhook receiver is running!", { status: 200 });
  }

  try {
    const payload = await req.json();
    console.log("Received booking:", payload);

    let customerPhone = payload.PHONE || payload.phone || payload.mobile || payload.Mobile;

    if (!customerPhone && payload.answers) {
       for (const answer of payload.answers) {
          if (answer.type === 'phone' || answer.code === 'PHONE') {
             customerPhone = answer.value;
          }
       }
    }

    if (!customerPhone) {
      console.log("Could not find a phone number in the payload!");
      return new Response("No phone number found in booking data", { status: 400 });
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");

    const token = Deno.env.get("SUPERGREEN_TOKEN");
    const myPhone = Deno.env.get("SUPERGREEN_PHONE");
    
    if (!token || !myPhone) {
        return new Response("Missing SuperGreen credentials", { status: 500 });
    }

    const messageText = `Hi ${payload.firstName || "there"}! 👋\n\nThank you for booking with us! We have received your reservation and are looking forward to seeing you.\n\nLet us know if you have any questions before then.`;

    await sendMessage({
      token: token,
      fromNumber: myPhone,
      toNumber: cleanPhone,
      message: messageText,
      linkPreview: false,
    });

    return new Response("Success", { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
