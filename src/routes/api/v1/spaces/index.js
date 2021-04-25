import { connectToDatabase } from '$lib/db'
import { ObjectId } from 'mongodb'

export async function get (request) {
  try {
    const completed = request.query.get('completed') === 'true'
    console.log(completed)
    const dbConnection = await connectToDatabase()
    const db = dbConnection.db
    const collection = db.collection('nextspaces')
    const nextspaces = await collection.find('completed').toArray()
    return {
      status: 200,
      body: {
        nextspaces
      }
    }
  } catch (err) {
    console.log(err)
    return {
      status: 500,
      body: {
        error: 'A server error ocurred'
      }
    }
  }
}

export async function post (request) {
  
  try {
    const dbConnection = await connectToDatabase()
    const db = dbConnection.db
    const collection = db.collection('nextspaces')

    const nextspace = JSON.parse(request.body)

    await collection.insertOne(nextspace)
    return {
      status: 200,
      body: {
        status: 'success'
      }
    }
  } catch (err) {
    return {
      status: 500,
      body: {
        error: 'A server error ocurred'
      }
    }
  }
}

export async function put (request) {

  try {
    const dbConnection = await connectToDatabase()
    const db = dbConnection.db
    const collection = db.collection('nextspaces')

    const nextspace = JSON.parse(request.body)

    await collection.update({ _id: ObjectId(nextspace._id)}, { $set: { completed: nextspace.completed } })

    return {
      status: 200,
      body: {
        status: 'success'
      }
    }
  } catch (err) {
    return {
      status: 500,
      body: {
        error: 'A server error ocurred'
      }
    }
  }
}


// export async function del (request) {
// }
