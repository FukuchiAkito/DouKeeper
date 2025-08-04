import React, { useState } from 'react';
import Input from '../atoms/Input';
import Button from '../atoms/Button';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // バリデーションやAPI送信処理を書く予定
    console.log('Login with', { email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-4">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="メールアドレス"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="パスワード"
      />
      <Button type="submit">ログイン</Button>
    </form>
  );
};

export default LoginForm;
