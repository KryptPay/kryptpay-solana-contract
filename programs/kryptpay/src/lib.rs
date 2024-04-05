use anchor_lang::prelude::*;

declare_id!("7KSFNXrjkYoHbWj7YBV1kXCabY7kTnFB6VNNDAX83fbc");

#[program]
pub mod kryptpay {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
