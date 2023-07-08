import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ type: String, required: true, unique: true })
  username: string;

  @Prop({ type: String })
  password: string; // TODO may use authenticationHash

  @Prop({ type: Types.ObjectId, required: true, ref: 'role' })
  roleId: Types.ObjectId | string;

  @Prop({ type: String })
  token?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
