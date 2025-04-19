function generateResponse() {
	return `
  ==> /proc/uptime <==
  1488 0
  
  ==> /proc/sys/kernel/hostname <==
  Хуй Отчима
  
  ==> /proc/who <==
  Твоя_Жирная_Мамаша tty1 ${new Date().toISOString().split("T")[0]} 00:00)}
  
  ==> /proc/end <==
  ##Moba##
      `;
}

module.exports = { generateResponse };
