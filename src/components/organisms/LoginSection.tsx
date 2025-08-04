import React from 'react';
import LoginForm from '../molecules/LoginForm';

const LoginSection: React.FC = () => {
  return (
    <section className="p-6 max-w-md mx-auto bg-white rounded-2xl shadow-md">
      <h1 className="text-2xl font-bold mb-4 text-center">ログイン</h1>
      <p className="text-sm text-gray-500 mb-6 text-center">
        アカウントにログインしてください
      </p>
      <LoginForm />
    </section>
  );
};

export default LoginSection;
