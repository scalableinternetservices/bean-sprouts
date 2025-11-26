class CreateExpertAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :expert_assignments do |t|
      t.bigint :conversation_id, null: false
      t.bigint :expert_id, null: false
      t.string :status, null: false, default: 'active'
      t.datetime :assigned_at, null:false
      t.datetime :resolved_at

      t.timestamps
    end

    add_index :expert_assignments, :conversation_id
    add_index :expert_assignments, :expert_id
    add_index :expert_assignments, [:expert_id, :status]

    add_foreign_key :expert_assignments, :conversations, column: :conversation_id, on_delete: :cascade
    add_foreign_key :expert_assignments, :users, column: :expert_id, on_delete: :cascade
  end
end
