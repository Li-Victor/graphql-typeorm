import 'reflect-metadata';
import { createConnection } from 'typeorm';
import { GraphQLServer } from 'graphql-yoga';
import gql from 'graphql-tag';

import { IResolverMap } from './types/ResolverType';
import { User } from './entity/User';

let connectionORM;

const typeDefs = gql`
  type User {
    id: ID!
    firstName: String!
    lastName: String!
    age: Int!
    email: String!
  }

  type Query {
    hello(name: String): String!
    user(id: ID!): User!
    users: [User!]!
  }

  type Mutation {
    createUser(
      firstName: String!
      lastName: String!
      age: Int!
      email: String!
    ): User!
    updateUser(
      id: ID!
      firstName: String
      lastName: String
      age: Int
      email: String
    ): Boolean!
    deleteUser(id: ID!): Boolean!
  }

`;

const resolvers: IResolverMap = {
  Query: {
    hello: (_, { name }) => `Hellssso ${name || 'World'}`,
    user: async (_, { id }) => {
      let userRepo = connectionORM.getRepository(User);
      return userRepo.findOne(id);
    },
    users: () => User.find()
  },
  Mutation: {
    createUser: (_, args) => User.create(args).save(),
    updateUser: async (_, { id, ...args }) => {
      let userRepo = connectionORM.getRepository(User);
      let userToUpdate = await userRepo.findOne(id);

      for (const key in args) {
        if (args.hasOwnProperty(key)) {
          userToUpdate[key] = args[key];
        }
      }

      try {
        await userRepo.save(userToUpdate);
      } catch (err) {
        return false;
      }
      return true;
    },
    deleteUser: async (_, { id }) => {
      let userRepo = connectionORM.getRepository(User);
      try {
        const userToRemove = await userRepo.findOne(id);
        if (!userToRemove) {
          return false;
        }
        await userRepo.remove(userToRemove);
        return true;
      } catch (err) {
        return false;
      }
    }
  }
};

const server = new GraphQLServer({ typeDefs, resolvers });
// can use .env
createConnection({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '',
  synchronize: true,
  logging: true,
  entities: ['src/entity/**/*.ts'],
  migrations: ['src/migration/**/*.ts'],
  subscribers: ['src/subscriber/**/*.ts'],
  cli: {
    entitiesDir: 'src/entity',
    migrationsDir: 'src/migration',
    subscribersDir: 'src/subscriber'
  }
}).then(connection => {
  connectionORM = connection;
  server.start(() => console.log('Server is running on localhost:4000'));
});
