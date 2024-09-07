# la-orden-suprema-api

**La Orden Suprema** is a web application designed to manage and control information related to a global network of assassins. Inspired by the John Wick universe, this project aims to provide a secure platform where assassins can track their history, debts with other assassins, and assigned missions. The application also allows assassins to exchange money for assassin coins and locate their colleagues for various purposes.

## Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/get-npm) (Node.js package manager)

### Installation

1. Clone the repository to your local machine:

    ```bash
    git clone https://github.com/supermaty01/la-orden-suprema-api.git
    ```

2. Navigate to the project directory:

    ```bash
    cd la-orden-suprema-api
    ```

3. Install the dependencies:

    ```bash
    npm install
    ```

### Running the Project

1. Create a `.env` file in the root directory and add the following variables:

    ```bash
    PORT=""
    MONGO_URL=""
    JWT_SECRET=""
    SMTP_SERVER=""
    SMTP_SECURE=""
    SMTP_USER=""
    SMTP_PASSWORD=""
    SMTP_FROM=""
    ```

2. Run the development server:

    ```bash
    npm run dev
    ```

Your app should now be running at `http://localhost:3000`.
