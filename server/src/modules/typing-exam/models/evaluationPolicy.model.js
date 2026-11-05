import mongoose from 'mongoose';
import { MEASUREMENT_UNITS, SPEED_METHODS, ERROR_METHODS, PENALTY_METHODS, ROUNDING_METHODS } from '../constants/typing.constants.js';
const { Schema, model, models } = mongoose;
const schema=new Schema({
  examVersionId:{type:Schema.Types.ObjectId,ref:'TypingExamVersion',required:true,index:true},
  name:{type:String,required:true,trim:true,maxlength:200},
  version:{type:Number,min:1,default:1},
  measurement:{unit:{type:String,enum:MEASUREMENT_UNITS,required:true}},
  duration:{seconds:{type:Number,min:1,required:true}},
  normalization:{type:String,enum:['NFC','NFD','NFKC','NFKD','NONE'],default:'NFC'},
  speed:{grossMethod:{type:String,enum:SPEED_METHODS,required:true},netMethod:{type:String,enum:SPEED_METHODS}},
  errors:{method:{type:String,enum:ERROR_METHODS,required:true},allowedPercentage:{type:Number,min:0,max:100}},
  penalty:{method:{type:String,enum:PENALTY_METHODS,default:'NONE'},value:{type:Number,min:0,default:0}},
  qualification:{minimumSpeed:{type:Number,min:0},maximumErrors:{type:Number,min:0}},
  rounding:{method:{type:String,enum:ROUNDING_METHODS,default:'ROUND'},decimalPlaces:{type:Number,min:0,max:6,default:2}}
},{timestamps:true,versionKey:false});
schema.index({examVersionId:1,version:1},{unique:true});
export default models.EvaluationPolicy || model('EvaluationPolicy',schema);
