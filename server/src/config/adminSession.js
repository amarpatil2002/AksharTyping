import session from "express-session";
import MongoStore from "connect-mongo";

const isProduction = process.env.NODE_ENV === "production";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is missing");
}

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET is missing");
}

export const sessionMiddleware = session({
  name: "akshar.admin.sid",
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: "admin_sessions",
    ttl: 60 * 60 * 8,
  }),

  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 8,
  },
});
