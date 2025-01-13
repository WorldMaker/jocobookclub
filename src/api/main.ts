import { Hono } from "hono";
import inviteApp from "./invite.ts";
import loginApp from "./login.ts";
import userApp from "./user.ts";

const app = new Hono()
  .route("/invite", inviteApp)
  .route("/login", loginApp)
  .route("/user", userApp);

Deno.serve(app.fetch);
