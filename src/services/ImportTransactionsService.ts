import fs from 'fs';
import path from 'path';
import parse from 'csv-parse/lib/sync';

import uploadConfig from '../config/upload';

import Transaction from '../models/Transaction';

import CreateTransactionService from './CreateTransactionService';

interface Request {
  filename: string;
}

class ImportTransactionsService {
  async execute({ filename }: Request): Promise<Transaction[]> {
    const createTransaction = new CreateTransactionService();

    const filePath = path.join(uploadConfig.directory, filename);
    const fileContent = await fs.promises.readFile(filePath);

    const recordsFile = parse(fileContent, { delimiter: ', ', from_line: 2 });

    const transactions: Transaction[] = [];

    await recordsFile.reduce(
      async (
        previousPromise: Promise<Transaction>,
        current: [string, 'income' | 'outcome', number, string],
      ) => {
        const [title, type, value, category] = current;

        const createTransactionParams = { title, type, value, category };

        return previousPromise.then(() =>
          createTransaction
            .execute(createTransactionParams)
            .then(transactionCreated => {
              transactions.push(transactionCreated);

              return transactionCreated;
            }),
        );
      },
      Promise.resolve(),
    );

    await fs.promises.unlink(filePath);

    return transactions;
  }
}

export default ImportTransactionsService;
