import usersData from './users.json';
import transferData from './transferData.json';

export interface ValidUser {
  id: string;
  username: string;
  password: string;
  description: string;
}

export interface InvalidUser extends ValidUser {
  expectedError: string;
}

export interface ValidTransfer {
  id: string;
  amount: string;
  description: string;
  expectedSuccess: boolean;
  category: string;
}

export interface InvalidTransfer extends ValidTransfer {
  expectedError?: string;
}

export interface BoundaryValue {
  amount: string;
  label: string;
  valid: boolean;
}

export const TestData = {
  users: {
    valid: usersData.validUsers as ValidUser[],
    invalid: usersData.invalidUsers as InvalidUser[],

    getValid(index = 0): ValidUser {
      const user = TestData.users.valid[index];
      if (!user) throw new Error(`No valid user at index ${index}`);
      return user;
    },

    default(): ValidUser {
      return TestData.users.getValid(0);
    },
  },

  transfers: {
    valid: transferData.validTransfers as ValidTransfer[],
    invalid: transferData.invalidTransfers as InvalidTransfer[],
    boundary: transferData.boundaryValues as BoundaryValue[],

    standard(): ValidTransfer {
      const t = TestData.transfers.valid.find((t) => t.id === 'standard_transfer');
      if (!t) throw new Error('Standard transfer test data not found');
      return t;
    },

    getById(id: string): ValidTransfer | InvalidTransfer | undefined {
      return [...TestData.transfers.valid, ...TestData.transfers.invalid].find((t) => t.id === id);
    },
  },
} as const;
