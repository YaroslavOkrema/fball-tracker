'use client';

import { useState } from 'react';
import { FootballLogo } from '@/components/football-logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const validImage =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"%3E%3Cpath fill="%23166534" d="M8 4h32v24L24 44 8 28Z"/%3E%3C/svg%3E';

export default function UiVerificationPage() {
  const [imageSource, setImageSource] = useState('/missing-team-crest.svg');
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-3xl font-bold">UI verification</h1>
      <div className="flex flex-wrap gap-3">
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary action</Button>
        <Button variant="destructive">Destructive action</Button>
        <Button disabled>Disabled action</Button>
        <Button asChild variant="outline">
          <a href="#details">Details link</a>
        </Button>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Open navigation</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Choose a section.</SheetDescription>
          </SheetHeader>
          <nav aria-label="Main navigation" className="flex flex-col gap-4 p-4">
            <SheetClose asChild>
              <a href="#matches">Matches</a>
            </SheetClose>
            <SheetClose asChild>
              <a href="#details">Details</a>
            </SheetClose>
          </nav>
        </SheetContent>
      </Sheet>
      <Tabs defaultValue="matches">
        <TabsList aria-label="Football sections">
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>
        <TabsContent value="matches" id="matches">
          Match content
        </TabsContent>
        <TabsContent value="standings">Standings content</TabsContent>
      </Tabs>
      <section
        aria-label="Image fallbacks"
        className="flex flex-wrap items-center gap-4"
      >
        <FootballLogo name="Missing team" kind="team" />
        <FootballLogo name="Empty competition" kind="competition" src=" " />
        <FootballLogo
          name="Broken competition"
          kind="competition"
          src="/missing-competition.svg"
        />
        <FootballLogo name="Recovering team" kind="team" src={imageSource} />
        <FootballLogo name="Loaded team" kind="team" src={validImage} />
        <Button onClick={() => setImageSource(validImage)}>
          Load valid crest
        </Button>
      </section>
      <section
        id="details"
        aria-label="Loading matches"
        aria-busy="true"
        className="space-y-3"
      >
        <span className="sr-only">Loading matches</span>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-16 w-full" />
      </section>
      <p className="text-muted-foreground">Secondary text remains readable.</p>
    </main>
  );
}
