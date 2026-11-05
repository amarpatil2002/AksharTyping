import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
const schema = new Schema({
  examId:{type:Schema.Types.ObjectId,ref:'TypingExam',required:true,index:true},
  version:{type:String,required:true,trim:true,maxlength:50},
  recruitmentCycle:{type:String,trim:true,maxlength:100},
  effectiveFrom:{type:Date,required:true}, effectiveTo:{type:Date},
  status:{type:String,enum:['DRAFT','ACTIVE','RETIRED'],default:'DRAFT',index:true}
},{timestamps:true,versionKey:false});
schema.index({examId:1,version:1},{unique:true});
export default models.TypingExamVersion || model('TypingExamVersion',schema);
