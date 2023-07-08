import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Role extends Document {
  @Prop({ type: String, required: true, unique: true })
  name: string;

  @Prop({ type: String })
  description?: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

export enum Roles {
  Super = 'super',
  Admin = 'admin',
  User = 'user',
}
