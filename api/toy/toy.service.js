import { ObjectId } from 'mongodb'
import { dbService } from '../../services/db.service.js'
import { loggerService } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'

const PAGE_SIZE = 4

export const toyService = {
    query,
    getById,
    remove,
    add,
    update,
    // addMsg,
    // removeMsg,
}

async function query(filterBy = {}) {
    const limitSize = filterBy.fetchAll ? Infinity : PAGE_SIZE

    try {
        const { filterCriteria, sortCriteria, skip } = _buildCriteria(filterBy)

        const collection = await dbService.getCollection('toy')
        const filteredToys = await collection
            .find(filterCriteria)
            .collation({'locale':'en'})
            .sort(sortCriteria)
            .skip(skip)
            .limit(limitSize)
            .toArray()
            
        const maxPage = Math.ceil(filteredToys.length / PAGE_SIZE)

        return { toys: filteredToys, maxPage }
    } catch (error) {
        loggerService.error('cannot find toys', error)
        throw error
    }
}

async function getById(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        const toy = collection.findOne({
            _id: ObjectId.createFromHexString(toyId),
        })
        return toy
    } catch (error) {
        loggerService.error(`while finding toy ${toyId}`, error)
        throw error
    }
}

async function remove(toyId) {
    try {
        const collection = await dbService.getCollection('toy')
        await collection.deleteOne({ _id: ObjectId.createFromHexString(toyId) })
    } catch (error) {
        loggerService.error(`cannot remove toy ${toyId}`, error)
        throw error
    }
}

async function add(toy) {
    try {
        toy.inStock = true
        const collection = await dbService.getCollection('toy')
        await collection.insertOne(toy)
        return toy
    } catch (error) {
        loggerService.error('cannot insert toy', error)
        throw error
    }
}

async function update(toy) {
    try {
        const { name, price, labels } = toy
        const toyToUpdate = {
            name,
            price,
            labels,
        }
        const collection = await dbService.getCollection('toy')
        await collection.updateOne(
            { _id: ObjectId.createFromHexString(toy._id) },
            { $set: toyToUpdate }
        )
        return toy
    } catch (error) {
        loggerService.error(`cannot update toy ${toy._id}`, error)
        throw error
    }
}

// async function addMsg(toyId, msg) {
//     try {
//         msg.id = utilService.makeId()
//         const collection = await dbService.getCollection('toy')
//         await collection.updateOne(
//             { _id: ObjectId.createFromHexString(toyId) },
//             { $push: { msgs: msg } }
//         )
//         return msg
//     } catch (error) {
//         loggerService.error(`cannot add message to toy ${toyId}`, error)
//         throw error
//     }
// }

// async function removeMsg(toyId, msgId) {
//     try {
//         const collection = await dbService.getCollection('toy')
//         await collection.updateOne(
//             { _id: ObjectId.createFromHexString(toyId) },
//             { $pull: { msgs: { id: msgId } } }
//         )
//         return msgId
//     } catch (error) {
//         loggerService.error(`cannot remove message from toy ${toyId}`, error)
//         throw error
//     }
// }

function _buildCriteria(filterBy) {
    const filterCriteria = {}

    if (filterBy.txt) {
        filterCriteria.name = { $regex: filterBy.txt, $options: 'i' }
    }
    if (filterBy.inStock) {
        filterCriteria.inStock = JSON.parse(filterBy.inStock)
    }
    if (filterBy.labels && filterBy.labels.length) {
        filterCriteria.labels = { $all: filterBy.labels }
    }
    const sortCriteria = {}

    const sortBy = filterBy.sortBy
    if (sortBy.type) {
        const sortDirection = +sortBy.sortDir
        sortCriteria[sortBy.type] = sortDirection
    } else sortCriteria.createdAt = -1
    
    const skip =
        filterBy.pageIdx !== undefined ? filterBy.pageIdx * PAGE_SIZE : 0
    console.log({ filterCriteria, sortCriteria, skip })

    return { filterCriteria, sortCriteria, skip }
}
