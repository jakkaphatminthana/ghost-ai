"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Cpu, Layers, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Design System</h1>

      {/* Buttons */}
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Button</p>
        <div className="flex gap-3 flex-wrap">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      {/* Icons */}
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Lucide React</p>
        <div className="flex gap-4 text-foreground">
          <Cpu className="h-5 w-5" />
          <Layers className="h-5 w-5" />
          <Zap className="h-5 w-5" />
        </div>
      </section>

      {/* Card */}
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Card</p>
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Architecture Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Describe your system and Ghost AI will generate the architecture.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Input + Textarea */}
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Input / Textarea</p>
        <div className="flex flex-col gap-3 w-80">
          <Input placeholder="Project name…" />
          <Textarea placeholder="Describe your system…" rows={3} />
        </div>
      </section>

      {/* Tabs */}
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Tabs</p>
        <Tabs defaultValue="canvas" className="w-80">
          <TabsList>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="spec">Spec</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="canvas">
            <p className="text-sm text-muted-foreground pt-2">Canvas view</p>
          </TabsContent>
          <TabsContent value="spec">
            <p className="text-sm text-muted-foreground pt-2">Spec view</p>
          </TabsContent>
          <TabsContent value="settings">
            <p className="text-sm text-muted-foreground pt-2">Settings view</p>
          </TabsContent>
        </Tabs>
      </section>

      {/* ScrollArea */}
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">ScrollArea</p>
        <ScrollArea className="h-32 w-80 rounded-xl border border-border p-3">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} className="text-sm text-muted-foreground py-0.5">
              Node {i + 1}: Service
            </p>
          ))}
        </ScrollArea>
      </section>

      {/* Dialog */}
      <section className="space-y-2">
        <p className="text-sm text-muted-foreground">Dialog</p>
        <Dialog>
          <DialogTrigger>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Architecture</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <Textarea placeholder="Describe your system…" rows={4} />
              <Button className="w-full">Generate</Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}