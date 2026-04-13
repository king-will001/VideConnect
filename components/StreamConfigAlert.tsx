'use client';

import { Card, CardContent } from './ui/card';

const StreamConfigAlert = ({
  missingEnvVars,
}: {
  missingEnvVars: string[];
}) => {
  return (
    <section className="flex min-h-screen w-full items-center justify-center p-6 text-white">
      <Card className="w-full max-w-2xl border-none bg-dark-1">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Stream is not configured</h1>
            <p className="text-sm text-sky-1">
              Add the missing Stream variables to <code>.env.local</code> and
              restart the dev server.
            </p>
          </div>

          <div className="rounded-lg bg-dark-3 p-4 font-mono text-sm">
            {missingEnvVars.map((variable) => `${variable}=`).join('\n')}
          </div>

          <div className="text-sm text-sky-1">
            <p>Missing variables: {missingEnvVars.join(', ')}</p>
            <p>
              You can copy the template from <code>.env.example</code> and fill
              in your Stream dashboard values.
            </p>
            <p>After updating env vars, restart `npm run dev`.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default StreamConfigAlert;
