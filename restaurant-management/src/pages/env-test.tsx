export default function EnvTest() {
    return (
      <div>
        <h1>Env Check</h1>
        <p>API BASE: {process.env.NEXT_PUBLIC_API_BASE_URL ?? '❌ Not Loaded'}</p>
      </div>
    );
  }
  