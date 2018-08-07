type Resolver = (parent: any, args: any, context: any, info: any) => any;

export interface IResolverMap {
  [key: string]: {
    [key: string]: Resolver;
  };
}
