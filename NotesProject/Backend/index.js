const express = require('express')
const app = express()

//Esto es necesario para poder hacer peticiones a dominios de terceros en el backend
const cors = require('cors')
app.use(cors())

/* 
    Siempre que express recibe una solicitud HTTP GET, primero verificará si el directorio dist contiene un archivo correspondiente 
    a la dirección de la solicitud. Si se encuentra un archivo correcto, express lo devolverá.
*/
//app.use(express.static('dist'))

const Note = require('./models/note')
//Para imprimir el esquema
// console.log(Note.schema.obj)


let notes = [
  {
    id: 1,
    content: "HTML is easy",
    important: true
  },
  {
    id: 2,
    content: "Browser can execute only JavaScript",
    important: false
  },
  {
    id: 3,
    content: "GET and POST are the most important methods of HTTP protocol",
    important: true
  }
]



const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('---')
  next()
}

app.use(express.json())
app.use(requestLogger)

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/notes', (request, response) => {
  Note.find({}).then(notes => {
    response.json(notes)
  })
})

const generateId = () => {
  const maxId = notes.length > 0
    ? Math.max(...notes.map(n => n.id))
    : 0
  return maxId + 1
}

app.post('/api/notes', (request, response,next) => {
  const body = request.body

  if (body.content === undefined) {
    return response.status(400).json({ error: 'content missing' })
  }

  const note = new Note({
    content: body.content,
    important: body.important || false,
  })

  note.save().then(savedNote => {
    response.json(savedNote)
  })    
  .catch(error => next(error))

})

app.get('/api/notes/:id', (request, response) => {
  Note.findById(request.params.id).then(note => {
    response.json(note)
  })
})

app.delete('/api/notes/:id', (request, response) => {
  const id = Number(request.params.id)
  //Está filtrando sobre el json notes que escribí forzadamente 
  notes = notes.filter(note => note.id !== id)

  response.status(204).end()
})

app.put('/api/notes/:id', (request, response) => {
  const { content, important } = request.body
  
  Note.findByIdAndUpdate(
    request.params.id, 
    { content, important },
    { new: true, runValidators: true, context: 'query' }
  ) 
    .then(updatedNote => {
      response.json(updatedNote)
    })
    .catch(error => next(error))
})

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})