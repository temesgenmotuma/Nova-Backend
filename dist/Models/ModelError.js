"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ModelError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
    statusCode;
}
exports.default = ModelError;
/**
 *
 * // Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQA-tLbogMb16f3gFfdAcnR_qvi0HTHNw",
  authDomain: "nova-1210d.firebaseapp.com",
  projectId: "nova-1210d",
  storageBucket: "nova-1210d.firebasestorage.app",
  messagingSenderId: "171865039656",
  appId: "1:171865039656:web:62a6ceeb08ba28c8f8e61d",
  measurementId: "G-5CZKCMBNER"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
 */ 
//# sourceMappingURL=ModelError.js.map