@login @smoke
Feature: ParaBank User Authentication
  As a ParaBank customer
  I want to securely log into my banking account
  So that I can access my financial information

  Background:
    Given I am on the ParaBank login page

  # ─── Happy Path ──────────────────────────────────────────────────────────────

  @smoke @regression
  Scenario: Successful login with valid credentials
    When I log in with username "john" and password "demo"
    Then I should be logged in successfully
    And the welcome message should be displayed

  # ─── Negative Path ────────────────────────────────────────────────────────────

  @regression
  Scenario: Login fails with incorrect password
    When I log in with username "john" and password "wrongpassword"
    Then the login should fail
    And I should see the error message "The username and password could not be verified."

  @regression
  Scenario: Login fails with non-existent username
    When I log in with username "nonexistentuser12345" and password "anypassword"
    Then the login should fail
    And I should see the error message "The username and password could not be verified."

  @regression
  Scenario: Login fails with empty credentials
    When I submit the login form with empty credentials
    Then the login should fail
    And I should see an error message

  # ─── Data-Driven Login ────────────────────────────────────────────────────────

  @regression @data-driven
  Scenario Outline: Login validation across multiple credential combinations
    When I log in with username "<username>" and password "<password>"
    Then the login result should be "<result>"

    Examples:
      | username             | password      | result  |
      | john                 | demo          | success |
      | jane                 | demo          | success |
      | john                 | wrongpass     | failure |
      | nonexistentuser99    | anypassword   | failure |

  # ─── Session Management ───────────────────────────────────────────────────────

  @regression
  Scenario: User can log out after successful login
    Given I am logged in as "john" with password "demo"
    When I log out
    Then I should be returned to the login page
