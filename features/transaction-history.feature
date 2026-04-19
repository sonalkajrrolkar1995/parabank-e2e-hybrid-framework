@history @smoke
Feature: ParaBank Transaction History
  As a ParaBank customer
  I want to view my transaction history
  So that I can verify my account activity and ensure accuracy

  Background:
    Given I am logged in as "john" with password "demo"

  # ─── Happy Path ───────────────────────────────────────────────────────────────

  @smoke @regression
  Scenario: View transaction history for an account
    Given I navigate to account overview
    And I have at least one account
    When I view the transaction history for my first account
    Then the transaction table should be displayed
    And transactions should have date, description, and amount columns

  @regression
  Scenario: Transaction history reflects a completed transfer
    Given I have noted the account IDs
    When I transfer "75.00" from the first account to the second account
    Then the transfer should complete successfully
    When I view the transaction history for the source account
    Then a debit transaction of "75.00" should be visible
    When I view the transaction history for the destination account
    Then a credit transaction of "75.00" should be visible

  # ─── Data Integrity Rules ─────────────────────────────────────────────────────

  @regression
  Scenario: Transaction amounts match the transfer amount precisely
    Given I note the current transaction count for my first account
    When I transfer "123.45" from the first account to the second account
    Then the transfer should complete successfully
    When I view the transaction history for the source account
    Then a debit transaction of "123.45" should be visible
    And the transaction count should have increased by at least 1

  # ─── Filter / Search ──────────────────────────────────────────────────────────

  @regression
  Scenario: Filter transactions by activity period
    Given I navigate to the transaction history for my first account
    When I filter transactions by period "All" and type "All"
    Then the transaction table should be displayed

  @regression @data-driven
  Scenario Outline: Transaction history visible for multiple accounts
    Given I navigate to account overview
    When I view the transaction history for account number "<accountIndex>"
    Then the transaction page should load without errors

    Examples:
      | accountIndex |
      | 0            |
      | 1            |
