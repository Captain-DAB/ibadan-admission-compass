# Ibadan Admission Compass
### A Web-Based Admission Information Chatbot for Prospective Students of the University of Ibadan

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Project-blue?style=for-the-badge)](https://captain-dab.github.io/ibadan-admission-compass/)

## Overview

**Ibadan Admission Compass** is a web-based chatbot designed to help prospective students access relevant admission information about the University of Ibadan through a simple conversational interface.

The project addresses the difficulty prospective students may experience when searching through multiple webpages, announcements, and documents for admission-related information. Instead of manually navigating different sources, users can submit questions and receive relevant responses from the chatbot's structured knowledge base.

The application uses a React-based frontend and a locally maintained JSON knowledge base to retrieve relevant admission information. It is designed as a lightweight solution that does not require a dedicated backend server or paid AI API for its initial implementation.

## Objectives

The project aims to:

- Make University of Ibadan admission information easier to access.
- Provide a simple and responsive chatbot interface for prospective students.
- Organize relevant admission information in a structured knowledge base.
- Retrieve appropriate answers to users' admission-related questions.
- Provide fallback guidance when the chatbot cannot identify a suitable answer.
- Offer an additional information channel that complements the University's official communication platforms.

## Key Features

- **Conversational Interface:** Allows users to interact with the system by submitting questions in natural language.
- **Admission Information Retrieval:** Retrieves relevant answers from a structured local knowledge base.
- **Structured Knowledge Base:** Organizes admission-related questions and answers using JSON.
- **Fallback Responses:** Provides guidance when a submitted question cannot be answered reliably.
- **Responsive Interface:** Designed to support usability across different screen sizes.
- **Lightweight Architecture:** Operates without requiring a dedicated backend server or paid conversational AI service.

## Technology Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend development and user interface |
| JavaScript | Application logic and interaction |
| HTML5 | Application structure |
| CSS3 | Styling and responsive design |
| JSON | Structured admission knowledge base |
| Git & GitHub | Version control and project hosting |
| GitHub Pages | Application deployment |

## System Architecture

The application follows a frontend-oriented architecture.

1. The user accesses the chatbot through the web interface.
2. The user submits an admission-related question.
3. The application processes the question using its retrieval logic.
4. The system searches the local JSON knowledge base for relevant information.
5. A suitable response is presented to the user.
6. If no reliable match is found, the chatbot provides fallback guidance.

```text
              USER
                |
                v
       CHATBOT INTERFACE
                |
                v
       QUESTION PROCESSING
                |
                v
      RESPONSE RETRIEVAL LOGIC
                |
                v
       LOCAL JSON KNOWLEDGE BASE
                |
                v
        RESPONSE / FALLBACK
                |
                v
              USER
```

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Node.js
- npm
- Git

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Captain-DAB/ibadan-admission-compass.git
```

**2. Navigate into the project directory**

```bash
cd ibadan-admission-compass
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

Open the local development URL displayed in your terminal to access the application.

**5. Build for production**

```bash
npm run build
```

## Live Application

Access the deployed application:

**[Ibadan Admission Compass – Live Demo](https://captain-dab.github.io/ibadan-admission-compass/)**

## Project Scope and Limitations

The initial version focuses on providing answers to selected admission-related questions using locally stored information.

The project does not currently aim to:

- Replace the official University of Ibadan admission portal.
- Access confidential applicant or student records.
- Submit admission applications on behalf of users.
- Process admission payments.
- Make admission decisions or independently determine applicant eligibility.
- Provide guaranteed answers to questions outside its verified knowledge base.

Admission information can change over time. Therefore, the knowledge base should be reviewed and updated using authoritative University of Ibadan publications.

## Future Improvements

Potential improvements include:

- Expanding the admission knowledge base.
- Improving question matching and response retrieval.
- Introducing semantic search for differently worded questions.
- Developing an administrative interface for updating admission information.
- Adding usage analytics and frequently asked questions.
- Exploring multilingual support and integration with approved institutional information systems.

## Academic Project Information

**Project Title:** Design and Implementation of a Chatbot for Prospective Students: University of Ibadan Admission Unit.

**Institution:** University of Ibadan

**Department:** Computer Science, Faculty of Science

**Project Contributors:**
- Dahunsi Abdulbasit
- Omoniyi Deborah

**Project Type:** Undergraduate Academic Project

## Contributors

Contributions, suggestions, and feedback are welcome.

If you encounter an issue or have suggestions for improving the application, you can open an issue in this repository.

## Disclaimer

Ibadan Admission Compass is an academic project developed to provide supplementary admission information to prospective students. It is not an official University of Ibadan admission platform and is not affiliated with or endorsed by the University of Ibadan.

Users should verify important and time-sensitive admission information through the University's official communication channels.

---

**Developed as an undergraduate Computer Science project at the University of Ibadan.**
