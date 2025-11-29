import argon2 from 'argon2'

async function createUser(email: string, name: string, password: string) {
    const hash = argon2.hash(password)
}