import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
const schema=new Schema({
  attemptId:{type:Schema.Types.ObjectId,ref:'TypingAttempt',required:true,unique:true,index:true},
  examVersionId:{type:Schema.Types.ObjectId,ref:'TypingExamVersion',required:true,index:true},
  policyId:{type:Schema.Types.ObjectId,ref:'EvaluationPolicy',required:true},
  calculation:{formula:{type:String,required:true},grossSpeed:{type:Number,min:0},netSpeed:{type:Number,min:0},effectiveMistakes:{type:Number,min:0},permissibleMistakes:{type:Number,min:0},penalty:{type:Number,min:0}},
  score:{marks:{type:Number,min:0},maximumMarks:{type:Number,min:0},percentage:{type:Number,min:0,max:100},scaledScore:{type:Number}},
  qualification:{minimumSpeed:{type:Number,min:0},achievedSpeed:{type:Number,min:0},speedQualified:Boolean,errorQualified:Boolean,overallQualified:Boolean},
  result:{type:String,enum:['PASS','FAIL','QUALIFIED','NOT_QUALIFIED','INCOMPLETE'],required:true},
  engineVersion:{type:String,required:true,default:'1.0.0'}
},{timestamps:true,versionKey:false});
schema.index({examVersionId:1,result:1});
export default models.ExamEvaluation || model('ExamEvaluation',schema);
