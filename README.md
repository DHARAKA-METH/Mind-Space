#  MindSpace

### Mental Wellness Support Platform for University Students

MindSpace is a mental wellness support mobile application designed for university students to track their mood and stress, access suitable wellness resources, receive AI-assisted general support, communicate anonymously with counselors, and book counseling appointments through a single platform.


##  Features

###  Authentication & User Management

Secure user registration, login, logout, session handling, and role-aware access are provided using Firebase Authentication.

###  Mood & Stress Check-In

Students can record their current mood, self-reported stress level from `0–10`, an optional personal note, and optionally provide a facial image for supplementary emotion analysis.

###  Personal Mood Dashboard

The dashboard displays previously recorded mood and stress information so students can review and reflect on changes in their emotional well-being over time.

###  Facial Emotion Analysis

Optional facial-emotion analysis provides supplementary emotional information that may support stress estimation but is never treated as a medical or psychological diagnosis.

###  Wellness Hub

The Wellness Hub recommends and provides access to meditation, relaxing music, breathing exercises, stress-management tips, self-care guidance, and educational wellness resources based on the student's mood and stress level.

###  YouTube & Spotify Resources

Wellness content from YouTube and Spotify is provided through approved external links and search links, allowing students to open relevant meditation videos, music, and playlists in the corresponding application or browser.

> **MindSpace does not use the YouTube API or Spotify API; it only provides external links/search links to relevant content.**

###  AI Wellness Assistant

The AI wellness assistant provides empathetic, non-diagnostic support, general wellness guidance, suitable resource suggestions, and safety-focused responses when potentially serious emotional distress is detected.

###  Anonymous Counselor Chat

Students can communicate with an assigned counselor through a real-time privacy-focused chat where unnecessary personal identity information is hidden from the conversation interface.

###  Appointment Booking

Students can select a counselor, choose an available date and time, select a session type, book an appointment, and later view their booked appointment information.

###  Privacy & Role-Based Access

Firebase Authentication, Firestore Security Rules, role-based permissions, ownership checks, and anonymous chat controls are used to restrict access to sensitive student information.

---

#  Technology Stack

## Mobile Application

- **React Native**
- **Expo**
- **TypeScript**
- **Tailwind CSS**

## Backend & Cloud

- **Firebase Authentication**
- **Cloud Firestore**
- **Firebase Cloud Functions**

## AI Services

- AI model for wellness-support conversations and recommendations
- Hugging Face model for optional facial-emotion analysis

## External Wellness Resources

- **YouTube links/search links**
- **Spotify links/search links**


#  System Architecture

MindSpace follows a cloud-connected mobile architecture where the React Native application communicates with Firebase services for authentication, application data, real-time communication, and trusted server-side operations.

```text
                         ┌─────────────────────────┐
                         │     MindSpace Mobile    │
                         │   React Native + Expo   │
                         │       TypeScript        │
                         └────────────┬────────────┘
                                      │
                                      │
                       Firebase SDK / HTTPS
                                      │
                                      ▼
                    ┌─────────────────────────────┐
                    │          Firebase           │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼─────────────────────┐
              │                    │                     │
              ▼                    ▼                     ▼
     ┌────────────────┐   ┌─────────────────┐   ┌──────────────────┐
     │    Firebase    │   │ Cloud Firestore │   │ Firebase Cloud   │
     │ Authentication │   │                 │   │    Functions     │
     └────────────────┘   └────────-────────┘   └─────────┬────────┘
                                                           │
                                                           │
                                                           │
                                                           │
                                                           ▼
                                                      AI Service
                                                            │
                                                            │
                                                            │
                                                         ┌──┴───────────┐
                                                         │              │
                                                         ▼              ▼
                                                   AI Wellness     Facial Emotion
                                                     Support         Analysis
                                                        │
                                                        │
                                                Wellness Resources
              
```


---

#  Getting Started

## Prerequisites

Install the following before running the project:

- Node.js
- npm
- Git
- Expo
- Android Studio or Expo Go
- Firebase project configuration

---

## 1. Clone the Repository

```bash
git clone https://github.com/DHARAKA-METH/Mind-Space.git
```

Move into the project:

```bash
cd Mind-Space
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create the required environment configuration according to the Firebase and AI-service setup used by the project.

```env

EXPO_PUBLIC_HF_TOKEN=   # dima806/facial_emotions_image_detection – Hugging Face
EXPO_PUBLIC_DEEPSEEK_API_KEY= # Deepseel AI Model - deepseek-v4-flash

```

---

## 4. Start the Development Server

```bash
npx expo start
```

To clear the Expo/Metro cache:

```bash
npx expo start --clear
```

The application can then be tested using:

- Expo Go
- Android Emulator
- Physical Android Device

---

#  Android Build

MindSpace uses **Expo Application Services (EAS)** to create Android builds.

Configure EAS:

```bash
eas build:configure
```

Create a testing APK:

```bash
eas build --platform android --profile preview
```

Create a production Android build:

```bash
eas build --platform android --profile production
```


# 📄 License

This application was developed primarily for academic and educational purposes.
---

Please contact the project maintainers before using the project or its content for commercial purposes.

---

##  Download App

Download the latest Android build of MindSpace from Expo EAS:


[⬇️ Download MindSpace Android App](https://expo.dev/accounts/slprime82/projects/MindSpace/builds/6e503355-a3de-419f-9adf-c1580497c772)




##  Screenshots


<img width="688" height="1538" alt="ss 1" src="https://github.com/user-attachments/assets/9dd0660c-9e85-40b1-9e1f-9208d71ec3de" />

<img width="688" height="1538" alt="ss 2" src="https://github.com/user-attachments/assets/3926c5c5-9607-45af-a2c0-76ba89f07d91" />








      
