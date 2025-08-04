import React, { useState } from 'react';
import Input from '../components/atoms/Input';
import Button from '../components/atoms/Button';
import LoginForm from '../components/molecules/LoginForm';

const TestPage: React.FC = () => {
  const [text, setText] = useState('');

  return (
    <div className="p-8">
      <h1 className="text-xl mb-4">Input コンポーネントのテスト</h1>
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text"
      />
      <p className="mt-4 text-gray-700">入力された値: {text}</p>
      <Button onClick={() => setText('')}>クリア</Button>
      <LoginForm />
    </div>
  );
};

export default TestPage;
