import React from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function BuyToken() {
  return (
    <section className="w-full px-4 py-8 md:px-8 md:py-10">
      <div className="w-full max-w-4xl mx-auto">
        <Card className="p-4">
          <div className="flex flex-col items-center">
            <img
              src="/ticket.jpg"
              alt="IUT Transport Service Ticket"
              className="w-full max-w-3xl rounded-lg shadow-md"
            />
            <Button className="mt-6 w-full max-w-3xl h-14 text-lg">Buy Token</Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
