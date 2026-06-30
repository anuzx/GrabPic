import express from "express";

const app = express();

app.use(express.json());

import authRouter from "./auth/auth.route";

app.use("/api/auth", authRouter);

app.listen(5000, () => console.log("server running at port 5000"));
