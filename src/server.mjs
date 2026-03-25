import mongoose from "mongoose"
import app from "./index.mjs"
import dotenv from "dotenv"

dotenv.config()

mongoose.connect(process.env.DB)
.then(()=>console.log("Connected to Mongo"))
.catch(err=>console.log(err))

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})