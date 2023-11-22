describe("Comments Module", () => {
  const deletedID = Cypress._.random(1, 5)
  before('login', () => cy.login());

  describe("Create Comment", () => {
    /*
    1. return unauthorized
    2. validation error message
    3. return correct comment
    4. found comment on post by id endpoint
    5. found comment on all post endpoint
     */

    it("should return unauthorized", () => {
      cy.checkUnauthorized('POST', '/comments')
    })

    it("should return error validation messages", () => {
      cy.request({
        method: 'POST',
        url: '/comments',
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`
        },
        failOnStatusCode: false,
      }).then(response => {
        cy.badRequest(response, [
          "post_id must be a number conforming to the specified constraints",
          "content should not be empty"
        ])
      })
    })

    it("should return correct comment", () => {
      cy.generateCommentsData(5)

      cy.fixture('comments').then(commentsData => {
        commentsData.forEach(_comment => {
          cy.request({
            method: 'POST',
            url: '/comments',
            headers: {
              authorization: `Bearer ${Cypress.env('token')}`
            },
            body: _comment,
          }).then((response) => {
            const {
              success,
              data: { post_id, content },
            } = response.body

            expect(response.status).to.eq(201)
            expect(success).to.be.true
            expect(post_id).to.eq(_comment.post_id)
            expect(content).to.eq(_comment.content)
          })
        })
      })
    })

    it("should be found in get post by id endpoint", () => {
      cy.fixture('comments').then((commentsData) => {
        commentsData.forEach((comment) => {
          cy.request({
            method: 'GET',
            url: `posts/${comment.post_id}`,
            headers: {
              authorization: `Bearer ${Cypress.env('token')}`,
            },
          }).then((response) => {
            const { comments } = response.body.data
            const isFound = comments.some((comment) => comment.content === comment.content,
            )

            expect(comments).to.be.ok
            expect(isFound).to.be.ok
          })
        })
      })
    })

    it("should be found in get all posts enpoint", () => {
      cy.request({
        method: 'GET',
        url: `/posts`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then((response) => {
        cy.fixture('comments').then((commentsData) => {
          const posts = response.body.data
          commentsData.forEach((comment) => {
            const isFound = posts
              .find((post) => post.id === comment.post_id)
              .comments.some((_comment) => _comment.content === comment.content)

            expect(isFound).to.be.true
          })
        })
      })
    })
  })

  describe("Delete Comment", () => {
    /* 
    1. return authorized
    2. return not found when enter random id
    3. successfully deleted comment
    4. not found in detail post endpoint
    */

    it("should return unauthorized", () => {
      cy.checkUnauthorized('DELETE', '/comments/1')
    })

    it("return not found", () => {
      cy.request({
        method: 'DELETE',
        url: `/comments/${Cypress._.random(6, 10)}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404)
      })
    })

    it("should successfully delete comment", () => {
      cy.request({
        method: 'DELETE',
        url: `/comments/${deletedID}`,
        headers: {
          authorization: `Bearer ${Cypress.env('token')}`,
        },
      }).then((response) => {
        expect(response.status).to.eq(200)
        const { message, success } = response.body

        expect(message).to.eq("Comment deleted successfully")
        expect(success).to.be.true
      })
    })

    it("should not be found in detail post endpoint", () => {
      cy.fixture('comments').then(commentsData => {
        const deletedComment = commentsData[deletedID - 1]

        cy.request({
          method: 'GET',
          url: `/posts/${deletedComment.post_id}`,
          headers: {
            authorization: `Bearer ${Cypress.env('token')}`
          }
        }).then(response => {
          const { comments } = response.body.data
          const isFound = comments.some((comment) => comment.id === deletedID && comment.content === deletedComment.content)

          expect(isFound).to.be.false
        })
      })
    })
  })
})