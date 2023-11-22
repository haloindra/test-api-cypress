describe('Auth Module', () => {

  //global user data
  const userData = {
    name: "John Doe",
    email: "john@nest.test",
    password: "Secret_123",
  }
  describe('Register', () => {
    // error validation
    // null name, null email, null password
    // error invalid password format 
    // register successfully
    // error duplicate user entry 

    it('Should return error message for validation', () => {
      cy.request({
        method: 'POST',
        url: '/Auth/register',
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response,
          [
            'name should not be empty',
            'name must be a string',
            'email should not be empty',
            'email must be an email',
            'password should not be empty',
            'password is not strong enough'
          ]);
      })
    })

    it('should return error message for invalid email format', () => {
      cy.request({
        method: 'POST',
        url: '/Auth/register',
        body: {
          "name": userData.name,
          "email": "john @ nest.test",
          "password": userData.password
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, ['email must be an email'])
      })
    })

    it('should return error message for invalid password format', () => {
      cy.request({
        method: 'POST',
        url: '/Auth/register',
        body: {
          name: userData.name,
          email: userData.email,
          password: "invalidpassword",
        },
        failOnStatusCode: false,
      }).then((response) => {
        cy.badRequest(response, ['password is not strong enough'])
      })
    })

    it('register successfully', () => {
      cy.resetUsers()
      cy.request({
        method: 'POST',
        url: '/Auth/register',
        body: userData
      }).then((response) => {
        const {
          id,
          name,
          email,
          password
        } = response.body.data;
        expect(response.status).to.eq(201);
        expect(response.body.success).to.be.true
        expect(id).not.to.be.undefined
        expect(name).to.eq('John Doe')
        expect(email).to.eq('john@nest.test')
        expect(password).to.be.undefined
      })
    })

    it('should returns error because of duplicate email', () => {
      cy.request({
        method: 'POST',
        url: '/Auth/register',
        body: userData,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(500)
        expect(response.body.success).to.be.false
        expect(response.body.message).to.eq('Email already exists')
      })
    })

  })

  describe('Login', () => {
    // // 1. Unauthorized on failed
    // 2. return access token
    it('should return unauthorized on failed', () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        failOnStatusCode: false,
      }).then(response => {
        cy.unauthorized(response)
      })

      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: 'wrongpassword'
        },
        failOnStatusCode: false,
      }).then(response => {
        cy.unauthorized(response)
      })
    })
    it('should return access token on success', () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: userData.password,
        },
      }).then((response) => {
        expect(response.body.success).to.be.true
        expect(response.body.message).to.eq('Login success')
        expect(response.body.data.access_token).not.to.be.undefined
      })
    })
  })
  describe('Me', () => {
    //1, error unauthorized
    // 2. return correct current data

    before('do login', () => {
      cy.login()
    })

    it('should return unauthorized when send no token', () => {
      cy.checkUnauthorized('GET', '/auth/me')
    })


    it('should return corrrect current data', () => {
      cy.request({
        method: 'POST',
        url: '/auth/login',
        body: {
          email: userData.email,
          password: userData.password,
        },
      }).then(response => {
        Cypress.env('token', response.body.data.access_token)
      })

      cy.request({
        method: 'GET',
        url: 'auth/me',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        const {
          id,
          name,
          email,
          password
        } = response.body.data;
        expect(response.status).to.eq(200);
        expect(response.body.success).to.be.true
        expect(id).not.to.be.undefined
        expect(name).to.eq(userData.name)
        expect(email).to.eq(userData.email)
        expect(password).to.be.undefined
      })
    })
  })
})

