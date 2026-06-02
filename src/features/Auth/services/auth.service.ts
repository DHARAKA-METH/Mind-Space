import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import {
  doc,
  setDoc,
} from "firebase/firestore";

import { auth, db } from "@/src/config/firebase";

/**
 * Register Data Type
 */
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  userType: "student" | "counselor";
}

/**
 * REGISTER USER
 */
export const registerUser = async ({
  name,
  email,
  password,
  userType,
}: RegisterData) => {
  // 1. Create Firebase Auth user
  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  const user = userCredential.user;


  // 2. Update display name in Auth
  await updateProfile(user, {
    displayName: name,
  });
  // 3. Common user data
  const baseData = {
    uid: user.uid,
    name,
    email,
    userType,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 4. Student user
  if (userType === "student") {
    await setDoc(doc(db, "users", user.uid), {
      ...baseData,
      userId: "AUTO_STUDENT",
      anonymousId:
        "anon_" +
        Math.random().toString(36).substring(2, 8),

      currentStressLevel: 0,
      currentMoodStatus: "neutral",
    });
  }

  // 5. Counselor user
  else {
    await setDoc(doc(db, "users", user.uid), {
      ...baseData,
      userId: "AUTO_COUNSELOR",

      specialization: "",
      availability: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
      },
    });
  }

  return user;
};

/**
 * LOGIN USER
 */
export const loginUser = async (
  email: string,
  password: string
) => {
  const userCredential =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  return userCredential.user;
};