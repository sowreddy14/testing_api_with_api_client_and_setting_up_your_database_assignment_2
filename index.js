const express = require('express');
const fs = require('fs-extra');
const app = express();
const PORT = 3000;
const BOOKS_FILE = './data.json';

app.use(express.json());

function validateBook(data, requireAllFields = true) {
  const requiredFields = ['book_id', 'title', 'author', 'genre', 'year', 'copies'];
  const errors = [];

  if (requireAllFields) {
    requiredFields.forEach(field => {
      if (!(field in data)) {
        errors.push(`Missing field: ${field}`);
      }
    });
  }

  if ('year' in data && typeof data.year !== 'number') errors.push('Year must be a number');
  if ('copies' in data && typeof data.copies !== 'number') errors.push('Copies must be a number');
  if ('title' in data && typeof data.title !== 'string') errors.push('Title must be a string');
  if ('author' in data && typeof data.author !== 'string') errors.push('Author must be a string');
  if ('genre' in data && typeof data.genre !== 'string') errors.push('Genre must be a string');

  return errors;
}

async function readBooks() {
  return await fs.readJson(BOOKS_FILE);
}

async function writeBooks(books) {
  return await fs.writeJson(BOOKS_FILE, books, { spaces: 2 });
}

app.post('/books', async (req, res) => {
  const book = req.body;
  const errors = validateBook(book);

  if (errors.length) {
    return res.status(400).json({ message: 'Invalid input', errors });
  }

  const books = await readBooks();
  if (books.find(b => b.book_id === book.book_id)) {
    return res.status(409).json({ message: 'Book ID already exists' });
  }

  books.push(book);
  await writeBooks(books);
  res.status(201).json(book);
});

app.get('/books', async (req, res) => {
  const books = await readBooks();
  res.json(books);
});

app.get('/books/:id', async (req, res) => {
  const books = await readBooks();
  const book = books.find(b => b.book_id === req.params.id);
  if (!book) {
    return res.status(404).json({ message: 'Book not found' });
  }
  res.json(book);
});

app.put('/books/:id', async (req, res) => {
  const books = await readBooks();
  const index = books.findIndex(b => b.book_id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Book not found' });
  }

  const updatedFields = req.body;
  const errors = validateBook(updatedFields, false);
  if (errors.length) {
    return res.status(400).json({ message: 'Invalid input', errors });
  }

  books[index] = { ...books[index], ...updatedFields };
  await writeBooks(books);
  res.json(books[index]);
});

app.delete('/books/:id', async (req, res) => {
  const books = await readBooks();
  const filteredBooks = books.filter(b => b.book_id !== req.params.id);

  if (books.length === filteredBooks.length) {
    return res.status(404).json({ message: 'Book not found' });
  }

  await writeBooks(filteredBooks);
  res.json({ message: 'Book deleted successfully' });
});


app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`📚 Library API running at http://localhost:${PORT}`);
});
