class AddSummaryUpdatedAtToConversations < ActiveRecord::Migration[8.1]
  def change
    add_column :conversations, :summary_updated_at, :datetime
  end
end
