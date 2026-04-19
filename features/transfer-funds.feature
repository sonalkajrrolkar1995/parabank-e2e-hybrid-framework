@transfer @smoke
Feature: ParaBank Fund Transfer
  As a ParaBank customer
  I want to transfer funds between my accounts
  So that I can manage my money across accounts

  Background:
    Given I am logged in as "john" with password "demo"
    And I navigate to the Transfer Funds page

  # ─── Happy Path ───────────────────────────────────────────────────────────────

  @smoke @regression
  Scenario: Successful fund transfer between accounts
    Given I note the current balance of all accounts
    When I transfer "100.00" from the first account to the second account
    Then the transfer should complete successfully
    And the confirmation should show the amount "100.00"
    And the account balances should reflect the transfer accurately

  @regression
  Scenario: Transfer with decimal precision
    When I transfer "99.99" from the first account to the second account
    Then the transfer should complete successfully
    And the confirmation should show the amount "99.99"

  # ─── Negative / Boundary Path ─────────────────────────────────────────────────

  @regression
  Scenario: Transfer fails with zero amount
    When I transfer "0" from the first account to the second account
    Then the transfer should fail
    And I should see a transfer error message

  @regression
  Scenario: Transfer fails with negative amount
    When I transfer "-50" from the first account to the second account
    Then the transfer should fail
    And I should see a transfer error message

  @regression
  Scenario: Transfer fails with empty amount
    When I submit a transfer with an empty amount
    Then the transfer should fail
    And I should see a transfer error message

  # ─── Data-Driven Transfer Validation ─────────────────────────────────────────

  @regression @data-driven
  Scenario Outline: Transfer validation with multiple amounts
    When I transfer "<amount>" from the first account to the second account
    Then the transfer outcome should be "<outcome>"

    Examples: Valid transfers
      | amount   | outcome |
      | 100.00   | success |
      | 0.01     | success |
      | 500.00   | success |
      | 99.99    | success |

    Examples: Invalid transfers — boundary values
      | amount   | outcome |
      | 0        | failure |
      | -50      | failure |
      | -0.01    | failure |

  # ─── Banking Integrity Rules ──────────────────────────────────────────────────

  @regression
  Scenario: Balance consistency is maintained after transfer
    Given I note the balance of the source account
    And I note the balance of the destination account
    When I transfer "50.00" from the first account to the second account
    Then the transfer should complete successfully
    And the source account balance should decrease by "50.00"
    And the destination account balance should increase by "50.00"
