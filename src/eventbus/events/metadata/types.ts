export interface IEventMetadata<TArgs extends any[] = any[]> {
  description: string;
  category: string;
  args: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
}
