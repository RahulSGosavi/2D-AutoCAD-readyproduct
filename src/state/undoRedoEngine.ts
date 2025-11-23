export interface Command {
  execute(): void;
  undo(): void;
  description?: string;
}

export class CommandStack {
  private past: Command[] = [];
  private future: Command[] = [];
  private maxSize = 50;

  execute(command: Command) {
    command.execute();
    this.past.push(command);
    if (this.past.length > this.maxSize) {
      this.past.shift();
    }
    this.future = [];
  }

  undo(): boolean {
    if (this.past.length === 0) return false;
    const command = this.past.pop()!;
    command.undo();
    this.future.push(command);
    return true;
  }

  redo(): boolean {
    if (this.future.length === 0) return false;
    const command = this.future.pop()!;
    command.execute();
    this.past.push(command);
    return true;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}

