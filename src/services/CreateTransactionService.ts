import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const findBalanceFromUser = await transactionsRepository.getBalance();

    if (
      type === 'outcome' &&
      findBalanceFromUser.outcome + value > findBalanceFromUser.income
    ) {
      throw new AppError(
        'You cannot add a transaction without a valid balance',
      );
    }

    const findIfCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!findIfCategoryExists) {
      const categoryCreated = categoryRepository.create({ title: category });

      await categoryRepository.save(categoryCreated);
    }

    const categoryFinded = await categoryRepository.findOne({
      where: { title: category },
    });

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: categoryFinded?.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
