import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
const schema = new Schema({
  examId:{type:Schema.Types.ObjectId,ref:'TypingExam',required:true,index:true},
  examVersionId:{type:Schema.Types.ObjectId,ref:'TypingExamVersion',required:true,index:true},
  title:{type:String,required:true,trim:true,maxlength:200},
  language:{type:String,required:true},
  content:{type:String,required:true,trim:false,maxlength:50000},
  wordCount:{type:Number,min:0}, characterCount:{type:Number,min:0},
  difficulty:{type:String,enum:['EASY','MEDIUM','HARD'],default:'MEDIUM'},
  status:{type:String,enum:['DRAFT','ACTIVE','INACTIVE'],default:'DRAFT',index:true}
},{timestamps:true,versionKey:false});
schema.index({examVersionId:1,status:1});
export default models.TypingPassage || model('TypingPassage',schema);
