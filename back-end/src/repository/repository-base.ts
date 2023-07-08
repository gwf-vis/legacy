import { FilterQuery, Model, QueryOptions } from 'mongoose';
import { Document } from 'mongoose';

export abstract class RepositoryBase<T> {
  constructor(protected readonly model: Model<T & Document>) {}

  async find(filter: FilterQuery<T & Document>) {
    return this.model.find(filter).exec();
  }

  async findOne(filter: FilterQuery<T & Document>) {
    return this.model.findOne(filter).exec();
  }

  async insert(entity: Partial<T>) {
    const insertedDocument = new this.model(entity as T);
    return insertedDocument.save();
  }

  async insertMany(entities: Partial<T>[]) {
    return this.model.insertMany(entities);
  }

  async update(
    filter: FilterQuery<T & Document>,
    entity: Partial<T>,
    options?: QueryOptions,
  ) {
    return this.model.updateMany(filter, entity as any, options);
  }

  async remove(filter: FilterQuery<T & Document>) {
    return this.model.remove(filter);
  }
}
